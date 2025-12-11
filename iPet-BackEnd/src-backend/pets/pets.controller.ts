import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
    constructor(private readonly petsService: PetsService) { }

    @Post()
    create(@Req() req: AuthenticatedRequest, @Body() createPetDto: CreatePetDto) {
        const uid = req.user?.uid;
        if (!uid) throw new UnauthorizedException('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.petsService.create(userId, createPetDto);
    }

    @Get()
    findAll(@Req() req: AuthenticatedRequest) {
        const uid = req.user?.uid;
        if (!uid) throw new UnauthorizedException('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.petsService.findAll(userId);
    }

    @Get(':id')
    findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        const uid = req.user?.uid;
        if (!uid) throw new UnauthorizedException('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.petsService.findOne(id, userId);
    }

    @Patch(':id')
    update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() updatePetDto: UpdatePetDto) {
        const uid = req.user?.uid;
        if (!uid) throw new UnauthorizedException('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.petsService.update(id, userId, updatePetDto);
    }

    @Delete(':id')
    remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        const uid = req.user?.uid;
        if (!uid) throw new UnauthorizedException('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.petsService.remove(id, userId);
    }
}
